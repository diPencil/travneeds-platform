export type EnquirySubjectType = 'tour' | 'offer'

export function buildQuestionSubject(title: string, subjectType: EnquirySubjectType): string {
  return `${subjectType === 'offer' ? 'Offer' : 'Tour'} enquiry: ${title}`
}

export function buildQuestionMessage(name: string, title: string, message: string, subjectType: EnquirySubjectType): string {
  const label = subjectType === 'offer' ? 'Offer' : 'Tour'
  return `Hello TravNeeds,\nName: ${name}\n${label}: ${title}\nQuestion: ${message}`
}
